// Lightweight Ridge regression trainer and predictor (closed-form)
// Replicates the notebook pipeline: feature engineering, time-split per beer, alpha search, train final model
type RawRow = { Date: string; Beer: string; UnitsSold: number; DayOfWeek?: string; IsWeekend?: string; HolidayEffect?: string; PromoLevel?: string };

type ModelRow = {
  Date: string;
  Beer: string;
  features: number[]; // in fixed order
  usage_7d_std_3w: number;
  target: number;
};

// Helpers: basic matrix ops
function transpose(A: number[][]) { return A[0].map((_,i) => A.map(r => r[i])); }
function matMul(A: number[][], B: number[][]) {
  const m = A.length, p = A[0].length, n = B[0].length;
  const C = Array.from({length:m}, ()=>Array(n).fill(0));
  for (let i=0;i<m;i++) for (let k=0;k<p;k++) for (let j=0;j<n;j++) C[i][j]+=A[i][k]*B[k][j];
  return C;
}
function vecMatMul(A: number[][], x: number[]) { return A.map(row=>row.reduce((s,v,i)=>s+v*(x[i]??0),0)); }

// Solve (XTX + alpha*Reg) w = XTy via Gauss-Jordan inversion of square matrix
function invertMatrix(A: number[][]) {
  const n = A.length; const M = A.map(r=>r.slice());
  const I = Array.from({length:n}, (_,i)=>Array.from({length:n}, (_,j)=>i===j?1:0));
  for (let i=0;i<n;i++) { M[i] = M[i].concat(I[i]); }
  // forward
  for (let i=0;i<n;i++){
    let pivot = i;
    for (let r=i;r<n;r++) if (Math.abs(M[r][i])>Math.abs(M[pivot][i])) pivot=r;
    if (pivot!==i) { const tmp=M[i]; M[i]=M[pivot]; M[pivot]=tmp; }
    const val = M[i][i];
    if (Math.abs(val) < 1e-12) throw new Error('Singular matrix');
    for (let j=0;j<2*n;j++) M[i][j] /= val;
    for (let r=0;r<n;r++) if (r!==i){ const f=M[r][i]; for (let j=0;j<2*n;j++) M[r][j]-=f*M[i][j]; }
  }
  const Inv = M.map(r=>r.slice(n));
  return Inv;
}

function ridgeSolve(X: number[][], y: number[], alpha: number) {
  // add intercept column
  const n = X.length; const p = X[0].length;
  const Xb = X.map(r=>[1,...r]);
  const XT = transpose(Xb);
  const XTX = matMul(XT, Xb);
  // regularize all except intercept
  for (let i=1;i<XTX.length;i++) XTX[i][i] += alpha;
  const XTy = matMul(XT, y.map(v=>[v]));
  const XTXinv = invertMatrix(XTX);
  const wMat = matMul(XTXinv, XTy).map(r=>r[0]);
  return wMat; // includes intercept
}

function predictWithWeights(w: number[], x: number[]) { return w[0] + x.reduce((s,v,i)=>s+v*(w[i+1]??0),0); }

function meanAbsoluteError(ytrue:number[], ypred:number[]) {
  const n=ytrue.length; if(n===0) return Infinity;
  let s=0; for(let i=0;i<n;i++) s+=Math.abs(ytrue[i]-ypred[i]); return s/n;
}

// Feature engineering and model pipeline
export function trainRidgeAndRecommend(rawRows: RawRow[]) {
  // group rows by Beer and sort by Date
  const groups = new Map<string, RawRow[]>();
  rawRows.forEach(r=>{ if(!groups.has(r.Beer)) groups.set(r.Beer,[]); groups.get(r.Beer)!.push(r); });
  for (const [k,arr] of groups) arr.sort((a,b)=>new Date(a.Date).getTime()-new Date(b.Date).getTime());

  // build model rows following notebook: compute target_7d_usage and features
  const modelRows: ModelRow[] = [];
  const beerIds = Array.from(groups.keys()).sort();
  const beerIdMap = new Map(beerIds.map((b,i)=>[b,i]));

  for (const [beer, arr] of groups.entries()){
    const n = arr.length;
    // precompute UnitsSold as array
    const units = arr.map(r=>r.UnitsSold);
    // compute target = sum next 7 days (i+1..i+7)
    for (let i=0;i<n;i++){
      if (i+7 >= n) continue; // need full next 7 days
      const target = units.slice(i+1,i+8).reduce((s,v)=>s+v,0);
      // usage_7d_past is previous target (shift 1)
      const idxPast = i-1;
      if (idxPast < 0) continue; // need past
      const usage_7d_past = (()=>{
        if (idxPast+7 >= n) return NaN;
        return units.slice(idxPast+1, idxPast+8).reduce((s,v)=>s+v,0);
      })();
      if (!isFinite(usage_7d_past)) continue;
      const usage_7d_t2 = (()=>{
        const id = idxPast-1; if (id<0) return NaN; if (id+7>=n) return NaN; return units.slice(id+1,id+8).reduce((s,v)=>s+v,0);
      })();
      if (!isFinite(usage_7d_t2)) continue;
      // rolling mean/std of usage_7d_past over window 3 ending at idxPast
      const arrPast = [] as number[];
      for (let w=idxPast-2; w<=idxPast; w++){ if (w>=0 && w+7<n) arrPast.push(units.slice(w+1,w+8).reduce((s,v)=>s+v,0)); }
      if (arrPast.length<3) continue;
      const mean3 = arrPast.reduce((s,v)=>s+v,0)/arrPast.length;
      const variance = arrPast.reduce((s,v)=>s+ (v-mean3)*(v-mean3),0)/arrPast.length;
      const std3 = Math.sqrt(variance);
      const trend = usage_7d_past - usage_7d_t2;
      const pct_change = usage_7d_t2===0?0: (usage_7d_past-usage_7d_t2)/usage_7d_t2;

      const row = arr[i];
      const dateObj = new Date(row.Date);
      const week_of_year = getIsoWeek(dateObj);
      const month = dateObj.getMonth()+1;
      const DayOfWeek = Number(row.DayOfWeek ?? dateObj.getDay());
      const IsWeekend = Number(row.IsWeekend ?? ((DayOfWeek===0||DayOfWeek===6)?1:0));
      const HolidayEffect = Number(row.HolidayEffect ?? 0);
      const PromoLevel = Number(row.PromoLevel ?? 0);

      const features = [
        usage_7d_past,
        usage_7d_t2,
        mean3,
        std3,
        trend,
        pct_change,
        week_of_year,
        month,
        DayOfWeek,
        IsWeekend,
        HolidayEffect,
        PromoLevel,
        beerIdMap.get(beer) ?? 0
      ];

      modelRows.push({ Date: row.Date, Beer: beer, features, usage_7d_std_3w: std3, target });
    }
  }

  if (modelRows.length===0) return { perBeerRecommendation: new Map<string, number>() };

  // build feature matrix and target, and keep mapping to modelRows indices
  const featureCols = modelRows[0].features.length;

  // time-split per beer: collect indices
  const byBeerIdx = new Map<string, number[]>();
  modelRows.forEach((mr,i)=>{ if(!byBeerIdx.has(mr.Beer)) byBeerIdx.set(mr.Beer,[]); byBeerIdx.get(mr.Beer)!.push(i); });

  const trainX: number[][] = []; const trainY: number[] = [];
  const testX: number[][] = []; const testY: number[] = [];
  const testIdxGlobal: number[] = [];

  for (const [beer, idxs] of byBeerIdx.entries()){
    // assume modelRows appear in chronological order within beer because we processed groups sorted
    const split = Math.floor(idxs.length * 0.8);
    idxs.forEach((gi, i)=>{
      const mr = modelRows[gi];
      if (i<split){ trainX.push(mr.features); trainY.push(mr.target); }
      else { testX.push(mr.features); testY.push(mr.target); testIdxGlobal.push(gi); }
    });
  }

  if (trainX.length===0 || testX.length===0) return { perBeerRecommendation: new Map<string, number>() };

  // alpha search
  const alphas = logspace(-3, 3, 20);
  let bestAlpha = alphas[0]; let bestMae = Infinity;
  for (const a of alphas){
    try{
      const w = ridgeSolve(trainX, trainY, a);
      const preds = testX.map(x=>predictWithWeights(w,x));
      const mae = meanAbsoluteError(testY, preds);
      if (mae < bestMae){ bestMae = mae; bestAlpha = a; }
    }catch(e){ continue; }
  }

  const finalW = ridgeSolve(trainX, trainY, bestAlpha);

  // predict for test rows and compute order_recommendation = ceil(pred)
  const perBeerRecommendation = new Map<string, number>();
  const perBeerPrediction = new Map<string, number>();
  const perBeerStd = new Map<string, number>();
  // for each beer take last modelRow (latest date) and predict
  for (const [beer, idxs] of byBeerIdx.entries()){
    const lastIdx = idxs[idxs.length-1];
    const mr = modelRows[lastIdx];
    const pred = predictWithWeights(finalW, mr.features);
    const rec = Math.ceil(pred);
    perBeerRecommendation.set(beer, isFinite(rec)?rec:0);
    perBeerPrediction.set(beer, isFinite(pred)?pred:0);
    perBeerStd.set(beer, isFinite(mr.usage_7d_std_3w)?mr.usage_7d_std_3w:0);
  }

  return { perBeerRecommendation, perBeerPrediction, perBeerStd, bestAlpha };
}

function logspace(a:number,b:number,n:number){
  const res:number[]=[]; for(let i=0;i<n;i++) res.push(Math.pow(10, a + (b-a)*i/(n-1))); return res;
}

function getIsoWeek(date: Date) {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(),0,1));
  return Math.ceil((((tmp.getTime() - yearStart.getTime())/86400000) + 1)/7);
}

export default { trainRidgeAndRecommend };

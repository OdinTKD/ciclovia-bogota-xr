// A 412×839 CSS viewport now retains at least 309×629 real scene pixels.
export const MIN_RATIO = .75;
export const FULL_DETAIL_RATIO = 1;
const MAX_RATIO = 1.5;
const FRAME_TARGET_MS = 1000 / 30;
const RECOVERY_FRAME_MS = 18;
const RECOVERY_STABLE_MS = 8000;
const RECOVERY_COOLDOWN_MS = 20000;
const RECOVERY_STEP = .125;
export const WINDOW_SIZE = 12;
export const initialPixelRatio = (deviceRatio:number) => Math.max(MIN_RATIO,Math.min(MAX_RATIO,Number.isFinite(deviceRatio)?deviceRatio:1));
/** Genuine frame windows, visual floor, slow recovery and backoff after overload. */
export function createQualityController(initialRatio = MAX_RATIO, ceiling = MAX_RATIO) {
  const maximum = Math.max(MIN_RATIO,Math.min(MAX_RATIO,Number.isFinite(ceiling)?ceiling:MAX_RATIO));
  let ratio=Math.min(maximum,Math.max(MIN_RATIO,Number.isFinite(initialRatio)?initialRatio:maximum));
  let revision=0, count=0, total=0, stable=0, cooldown=0;
  return {
    get ratio(){return ratio;}, get revision(){return revision;},
    sample(ms:number):boolean {
      if(!Number.isFinite(ms)||ms<=0)return false;
      count++; total+=ms; cooldown=Math.max(0,cooldown-ms);
      if(count<WINDOW_SIZE)return false;
      const mean=total/count, elapsed=total;count=0;total=0;
      let next=ratio;
      if(mean>FRAME_TARGET_MS){
        stable=0; cooldown=RECOVERY_COOLDOWN_MS;
        next=Math.max(MIN_RATIO,ratio/2);
      }else if(mean<=RECOVERY_FRAME_MS&&cooldown===0){
        stable+=elapsed;
        if(stable>=RECOVERY_STABLE_MS){next=Math.min(maximum,ratio+RECOVERY_STEP);stable=0;}
      }else stable=0;
      if(next===ratio)return false;
      ratio=next;revision++;return true;
    },
  };
}

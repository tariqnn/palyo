export const divisions=[
  {name:"Bronze",min:0},{name:"Silver",min:900},{name:"Gold",min:1050},
  {name:"Platinum",min:1200},{name:"Diamond",min:1400}
] as const;
export function divisionFor(rating:number){return [...divisions].reverse().find(d=>rating>=d.min)?.name||"Bronze";}
export interface RatingAlgorithm { change(input:{winner:string|undefined;team:string|null}):number }
export const defaultRatingAlgorithm:RatingAlgorithm={change({winner,team}){if(!winner)return 2;return team===winner?16:-12;}};

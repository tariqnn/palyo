export const xpRules={completedGame:100,win:30,mvp:50,newSport:100,tournament:150} as const;
export function xpForResult(input:{completed:boolean;won:boolean;mvp:boolean}){return [
  ...(input.completed?[["COMPLETED_GAME",xpRules.completedGame]]:[]),
  ...(input.won?[["WIN",xpRules.win]]:[]),
  ...(input.mvp?[["MVP",xpRules.mvp]]:[])
] as [string,number][];}

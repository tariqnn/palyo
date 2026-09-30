export function achievementsForResult(input:{games:number;wins:number;mvp:boolean;activeSports:number}){
 const codes:string[]=[];
 if(input.games>=1)codes.push("FIRST_GAME");
 if(input.games>=10)codes.push("TEN_GAMES");
 if(input.games>=50)codes.push("FIFTY_GAMES");
 if(input.games>=100)codes.push("HUNDRED_GAMES");
 if(input.wins>=1)codes.push("FIRST_WIN");
 if(input.mvp)codes.push("MVP");
 if(input.activeSports>=2)codes.push("MULTI_SPORT_PLAYER");
 return codes;
}

export type RatedPlayer={id:string;rating:number;position?:string|null};
export function balanceTeams(players:RatedPlayer[]){
  const ordered=[...players].sort((a,b)=>b.rating-a.rating||a.id.localeCompare(b.id));
  const black:RatedPlayer[]=[],white:RatedPlayer[]=[];
  let b=0,w=0;
  for(const player of ordered){
    const blackPositions=player.position?black.filter(p=>p.position===player.position).length:0;
    const whitePositions=player.position?white.filter(p=>p.position===player.position).length:0;
    const target=black.length<white.length?black:white.length<black.length?white:
      blackPositions<whitePositions?black:whitePositions<blackPositions?white:b<=w?black:white;
    target.push(player);if(target===black)b+=player.rating;else w+=player.rating;
  }
  return {black,white,difference:Math.abs(b/Math.max(1,black.length)-w/Math.max(1,white.length))};
}

import { describe,it,expect } from "vitest";
import { divisionFor,defaultRatingAlgorithm } from "./ratings";
import { xpForResult } from "./xp";
import { achievementsForResult } from "./achievements";
describe("progression rules",()=>{
 it("keeps the rating algorithm independent from XP",()=>{
  expect(defaultRatingAlgorithm.change({winner:"BLACK",team:"BLACK"})).toBe(16);
  expect(defaultRatingAlgorithm.change({winner:"BLACK",team:"WHITE"})).toBe(-12);
  expect(defaultRatingAlgorithm.change({winner:undefined,team:"WHITE"})).toBe(2);
  expect(xpForResult({completed:true,won:true,mvp:true})).toEqual([["COMPLETED_GAME",100],["WIN",30],["MVP",50]]);
 });
 it("uses configurable division thresholds",()=>{expect(divisionFor(880)).toBe("Bronze");expect(divisionFor(1284)).toBe("Platinum");expect(divisionFor(1500)).toBe("Diamond");});
 it("awards milestones from finalized progress",()=>{expect(achievementsForResult({games:10,wins:1,mvp:true,activeSports:2})).toEqual(["FIRST_GAME","TEN_GAMES","FIRST_WIN","MVP","MULTI_SPORT_PLAYER"]);});
});

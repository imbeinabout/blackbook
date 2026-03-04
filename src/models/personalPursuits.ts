// src/models/personalPursuits.ts
export type DiceExpr = string; // "1", "-1d4", "1d6", etc.

export interface PursuitEffect {
  san?: DiceExpr;
  selected_bond?: DiceExpr;
  skill?: DiceExpr;
  stat?: DiceExpr;
  unnatural?: DiceExpr;
}

export interface PersonalPursuit {
  id: string;
  name: string;
  description: string;

  test?: string;
  target?: "selected_bond";

  pre_effect?: PursuitEffect;
  post_effect?: PursuitEffect;

  result?: {
    failure?: PursuitEffect;
    critical_failure?: PursuitEffect;
    success?: PursuitEffect;
    critical_success?: PursuitEffect;
  };

  creates_bond?: {
    score: string;
  };

  requires_choice?: string[];
  grants?: string;
}

import pursuitsData from "../data/personalPursuits.json";

export const PERSONAL_PURSUITS = pursuitsData as PersonalPursuit[];
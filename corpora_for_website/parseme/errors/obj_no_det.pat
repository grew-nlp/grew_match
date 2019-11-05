% Constrution Verb+object without determiner, not annotater as a MWE
% Interesting to check in French, probably not on other languages…

pattern { GOV -[obj]-> DEP; DEP[upos=NOUN] }
without { DEP -[det|nummod|nmod:poss]-> DET }
without { MWE -[MWE]-> GOV; MWE -[MWE]-> DEP;  }

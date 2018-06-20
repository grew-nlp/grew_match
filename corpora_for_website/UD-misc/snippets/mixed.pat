% Search for a "det" dependency relation
% such that the governor's tag is different from NOUN, PROPN and ADJ

pattern {
  GOV [upos <> NOUN|ADJ|PROPN];
  GOV -[det]-> DEP;
}

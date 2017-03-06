% Search for a "det" dependency relation
% such that the governor category is different from NOUN, PROPN and ADJ

match {
  GOV [cat <> NOUN|ADJ|PROPN];
  GOV -[det]-> DEP;
}

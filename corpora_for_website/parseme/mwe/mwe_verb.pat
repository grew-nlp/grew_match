% Search for a MWE with a given verb lemma
% The node MWE indentifies the MWE and the node V the verb in it

pattern {
  MWE [label];                           % Search for a MWE node…
  MWE -[MWE]-> V;                        % …which contains a token V…
  V[upos=VERB, lemma="Lemma_to_search"]  % …with a given lemma
}

% Search for a MWE with any label
% Cluster the results by the label value

pattern {
  MWE [label];
  MWE -[MWE]-> V; 
  V[upos=VERB]
}

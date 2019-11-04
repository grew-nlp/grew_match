% Search for a MWE with tag LVC.full
% The node MWE indentifies the MWE and the node V the verb in it

pattern {
  MWE [label="LVC.full"];
  MWE -[MWE]-> V; 
  V[upos=VERB]
}

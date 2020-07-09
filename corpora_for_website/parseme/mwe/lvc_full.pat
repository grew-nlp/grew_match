% Search for a MWE with tag LVC.full
% The node MWE indentifies the MWE and the node V the verb in it

pattern {
  MWE [label="LVC.full"];   % each MWE is encoded as a new node with a "label" feature
  MWE -[parseme=MWE]-> V;   % the MWE node is linked to each token it contains with a special relation "parseme=MWE"
  V[upos=VERB]
}

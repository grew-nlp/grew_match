% Search for two nodes linked by a "subject" relation.
% Note that, due to distinction between final and canonical relations,
% we use a disjunction to match each surface subject

match {
  S [n=*];                                       % <--- a node S with a feature n
  V [cat=V, n=*];                                % <--- a node V with a feature cat=V and a feature n
  V -[suj:suj|suj:obj|S:suj:suj|S:suj:obj]-> S;  % <--- a dependency from V to S with a final function "subject"
}

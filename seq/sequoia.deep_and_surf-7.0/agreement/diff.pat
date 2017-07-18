% Select only cases where the number feature is different in the two nodes.
% When a "without" clause is added, each pattern selected by the "pattern" clause is rejected if it respects conditions of the "without" clause
% In our case, we reject all cases where the subject and the verb have the same "n" feature.

pattern {
  S [n=*];
  V [cat=V, n=*];
  V -[suj:suj|suj:obj|S:suj:suj|S:suj:obj]-> S;
}
without {
  S.n = V.n;                 % <--- NEW constraint on "n" features
}

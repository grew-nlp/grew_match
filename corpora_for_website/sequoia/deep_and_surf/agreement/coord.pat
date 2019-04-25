% The previous pattern still returns occurrences that are corretly annotated:
% for instance, in [annodis.er_00130], the subject is a coordination.
% Here, we avoid theses cases.

pattern {
  S [n=*];
  V [cat=V, n=*];
  V -[suj:suj|suj:obj|S:suj:suj|S:suj:obj]-> S;
}
without {
  S.n = V.n;
}
without {
  V[m=part, t=past];
  A[cat=V];
  V -[S:aux.tps]-> A;
}
without {
  S[n=s];                    % <--- a singular subject
  V[n=p];                    % <--- a plural verb
  S -[coord]-> *;            % <--- the subject is a coordination
}

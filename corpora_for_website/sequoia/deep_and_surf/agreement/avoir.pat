% The previous pattern returns occurence that are corretly annotated:
% for instance, in [annodis.er_00048], the verb is a past participle used with "avoir" auxiliary
% in this case, most of the times, there is no agreement. Here, we avoid theses cases.

pattern {
  S [n=*];
  V [cat=V, n=*];
  V -[suj:suj|suj:obj|S:suj:suj|S:suj:obj]-> S;
}
without {
  S.n = V.n;
}
without {
  V[m=part, t=past];         % <--- The verb is a past participle
  A[cat=V];                  % <--- There is a new node A with cat=V
  V -[S:aux.tps]-> A;        % <--- And there is a link "tense auxiliary" from V to A
}

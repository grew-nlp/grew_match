% Search a node N which is in two different MWEs

pattern {
  MWE1 -[parseme=MWE]-> N;
  MWE2 -[parseme=MWE]-> N;
  MWE1.__id__ < MWE2.__id__; % <-- Avoid to duplicate solutions
}

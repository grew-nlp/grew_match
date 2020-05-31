% Search a node N which is in two different MWEs

pattern {
  MWE1 -[MWE]-> N;
  MWE2 -[MWE]-> N;
  MWE1.__id__ < MWE2.__id__; % <-- Avoid to duplicate solutions
}

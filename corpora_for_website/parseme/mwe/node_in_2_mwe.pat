% Search a node N which is in two different MWE

pattern {
  MWE1 -[MWE]-> N; 
  MWE2 -[MWE]-> N;
  id(MWE1) < id(MWE2); 	  
}

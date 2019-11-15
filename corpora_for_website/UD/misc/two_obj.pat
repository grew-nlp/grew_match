% The requests looks for a node 'G' with two different objects 'O1' and 'O2'
% An additional constraint is needed to avoid duplicate solutions:
% If some occurrence is found, the swaping of 'O1' and 'O2' in the solution is also one,
% The constraint on line 9 imposes to given only one the two solutions

pattern {
  G -[obj]-> O1;
  G -[obj]-> O2;
  id(O1) < id(O2);  % <-- Avoid to duplicate solutions
}

% NB: 'id' refers to some internal identifier for node which is not relevant for the user in general

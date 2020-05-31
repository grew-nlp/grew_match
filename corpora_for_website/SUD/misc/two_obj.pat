% The requests looks for a node 'G' with two different objects 'O_1' and 'O_2'
% An additional constraint is needed to avoid duplicate solutions:
% If some occurrence is found, the swapping of 'O_1' and 'O_2' in the solution is also one,
% The constraint on line 9 imposes to given only one the two solutions.

pattern {
  G -[comp:obj]-> O_1;
  G -[comp:obj]-> O_2;
  O_1.__id__ < O_2.__id__;  % <-- Avoid to duplicate solutions
}

% NB: '__id__' refers to some internal identifier for node which is not relevant for the user in general

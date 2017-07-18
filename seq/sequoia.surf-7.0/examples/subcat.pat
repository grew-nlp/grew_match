% Search for a given sub-categorisation frame
% We search for a verb with at the same time a de_obj and an a_obj argument.

pattern {
  V [cat=V];
  V -[a_obj]-> A;
  V -[de_obj]-> DE;
}

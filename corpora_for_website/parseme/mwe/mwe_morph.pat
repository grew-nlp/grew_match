% Search for a MWE with some morphological restrictions

pattern {
  MWE [label];                                  % Search for a MWE node…
  MWE -[MWE]-> N1; N1 [upos=VERB];              % …which contains a verbal token …
  MWE -[MWE]-> N2; N2 [upos=NOUN, Number=Plur]; % …and a plural noun token."
}

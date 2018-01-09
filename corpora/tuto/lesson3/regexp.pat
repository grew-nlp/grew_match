% Regular expression for expressing constraint on a feature value

pattern {
  N.form = re".*ing";   % <== No space between 're' and the following string
  BE [lemma=be];
  N -[aux]-> BE
}

% Search for verb without subject

pattern { V [cat=V, m <> inf|imp|part] }
without { V -[suj]-> * }
without { V [lemma="il_y_a"|"voici"|"voilà" ] }
without { * -[aux.tps|aux.pass|aux.caus|dep.coord]-> V }

% Search for verb "prendre" with an determiner-free object (light verb construction)

pattern {
  V[lemma="prendre"]; 
  OBJ[upos=N]; 
  V -[obj]-> OBJ 
}
without { 
  D[]; OBJ -[det]-> D
}

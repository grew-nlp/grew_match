% Search for a verb whitout a direct object

match { V [cat=VERB]; }
without { V -[dobj]-> O }

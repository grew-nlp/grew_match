CORPORA+=" mSUD_Beja-NSC"
CORPORA+=" mSUD_Chinese-Beginner"
CORPORA+=" mSUD_Chinese-PatentChar"
CORPORA+=" SUD_French-GSD"
CORPORA+=" SUD_French-Rhapsodie"
CORPORA+=" SUD_French-ParisStories"
CORPORA+=" SUD_French-Sequoia"
CORPORA+=" SUD_Haitian_Creole-Autogramm"
CORPORA+=" SUD_Hausa-NorthernAutogramm"
CORPORA+=" SUD_Hausa-SouthernAutogramm"
CORPORA+=" SUD_Naija-NSC"
CORPORA+=" SUD_Zaar-Autogramm"

for i in $CORPORA
do
	make CORPUS=$i
done

## THIS FOLDER IS TO SHOW HOW THINGS ARE UPLOADED TO FIREBASE
It is not necessary to access this file for now but this is proof of things that are on firebase.


## This folder does not work unless it has this file
Get the SUBTLEX file from https://www.ugent.be/pp/experimentele-psychologie/en/research/documents/subtlexus

## Use these to create the necessary node_modules folder:

```
npm install
npm install firebase-admin
npm install read-excel-file
npm install --save-dev @types/node
npm install --save-dev ts-node
npm install --save-dev typescript
```


## Here are also the python libraries you need:

```
pip install pandas
pip install nltk
pip install openpyxl
```

## This is the order of the commands to put all the info with the cross referencing and everything.
'''
1. checkSUBTLEXwithWordnet.py # Cross-references Subtlex and Wordnet and gives a full json file with all the information needed.
2. splitChunk.py # Splits the full json file into separate parts so Firebase can actually accept uploads without going over the limit.
3. uploadJsonToFirestore.ts # Uploads 1 chunk of the full json file. Because firebase has limits for the free plan. Each chunk should be around 1 day of writes.
'''

## This is the order of the commands to only put a collection of words labeled with numbers in a collection.
'''
1. checkSUBTLEXwithWordnetbutXLSX.py # Cross-references Subtlex and Wordnet and gives a full xlsx file thats sorted.
2. difficulty_chunks.py # Splits words into json files with the appropriate difficulty.
3. upload_difficulty_chunks.ts # Uploads the 3 json files. Should only take 3 writes.
'''
## Use these commands to upload the proper things to firebase
'''
npx ts-node upload_difficulty_chunks.ts
npx ts-node uploadJsonToFirestore.ts
'''
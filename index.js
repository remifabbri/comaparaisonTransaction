const express = require('express')
const fs = require('fs');
const app = express()
const port = 3000

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

app.get('/TransactionControle', (req, res) => {
    let titre = "Controle des transactions";

    let dataCP = JSON.parse(fs.readFileSync('./database/marchControlePoints_4596221548.json'));
    let syncSM =  JSON.parse(fs.readFileSync("./database/synchroScrappingMarch_4596221548.json"));
    let compareResult = {};
    let matchResult = [];
    let noResult = {};

    Object.keys(dataCP).forEach( idCP => {
        
        // création d'un object de contrôle 
        compareResult = { 
            ...compareResult, 
            [idCP] : {
                ...dataCP[idCP], 
                refSyncSMMatch : [],
                refSyncSMNoPerfectMatch : [],
                message : ""
            }
        }

        Object.keys(syncSM).forEach( idSSM => { 
            let dateControleTenMore = dataCP[idCP].date + 10*60; 
            let dateControleTenLess = dataCP[idCP].date - 10*60; 

            if(dataCP[idCP].date === syncSM[idSSM].date && dataCP[idCP].balance === syncSM[idSSM].amount){
                compareResult[idCP].refSyncSMMatch.push({...syncSM[idSSM], id: idSSM});
                matchResult.push(idSSM);
            }else if(syncSM[idSSM].date < dateControleTenMore && syncSM[idSSM].date > dateControleTenLess ){
                if( dataCP[idCP].balance === syncSM[idSSM].amount ){
                    compareResult[idCP].refSyncSMNoPerfectMatch.push({...syncSM[idSSM], id: idSSM});
                    matchResult.push(idSSM);
                }
            }
        })
    })

    Object.keys(compareResult).forEach( item => {
        if(compareResult[item].refSyncSMMatch.length === 1){
            compareResult[item].message = "YES !! Douggie et ses comparses semblent avoir fait leur travail :D"
        }
        if(compareResult[item].refSyncSMMatch.length === 0 && compareResult[item].refSyncSMNoPerfectMatch.length === 0 ){
            compareResult[item].message = "AIE !! Douggie et ses comparses semblent n'avoir trouvé aucune correspondance :/"
        }
        if(compareResult[item].refSyncSMMatch.length === 0 && compareResult[item].refSyncSMNoPerfectMatch.length > 0 ){
            compareResult[item].message = "OUPS !! Douggie et ses comparses semblent avoir trouver une correspondance pas tout à fait exacte !"
        }
        if(compareResult[item].refSyncSMMatch.length > 1){
            compareResult[item].message = "AIE !! Douggie et ses comparses semblent avoir reniflé trop efficacement :/"
        }
    });

    // prendre en compte les résultat sans référence avec les transfères du point de contrôle
    Object.keys(syncSM).forEach(idSSM => {
        if(!matchResult.includes(idSSM)){
            noResult= {
                ...noResult,
                [idSSM] : syncSM[idSSM]
            }
        }
    })

    console.log(compareResult);

    res.render('pages/transactionControle', {
        data: compareResult,
        dataNoMatch : noResult,
        titre: titre
    });

})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})
const express = require('express');
const wait = {waitUntil: 'domcontentloaded'};
const puppeteer = require('puppeteer-extra');
const cors = require("cors");
const plugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(plugin());
const app = express();
var corsOptions = {
    origin: 'http://localhost:3000/',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}
app.use(cors());
app.options('/products/:id', cors()) // enable pre-flight request for DELETE request
app.get('/', async (req, res) => {
    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
    const browser = await puppeteer.launch({ 
        args: [
            '--no-sandbox', 
            '--disable-setuid-sandbox', 
            '--disable-gpu'
        ],
        headless:false,
    })
    //abrir navegador

    const page = await browser.newPage();
    await page.setDefaultNavigationTimeout(0); 
    //linea bendita que se hace pendejo al google jajajaja
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36')
    
    //Convierte el JSON de Bugie en un arreglo para leer
    let get = req.query.options || '';
    let getArray = [];
    getArray=JSON.parse(get);
    
    await page.goto("https://accounts.google.com/AddSession/identifier?hl=es&continue=https%3A%2F%2Fmail.google.com%2Fmail&service=mail&ec=GAlAFw&flowName=GlifWebSignIn&flowEntry=AddSession",wait)
    await page.waitForSelector('#identifierId',wait);
    await page.type('#identifierId', "daniel.growthy@gmail.com", { delay: 5 });
    await page.click('#identifierNext');
    await page.waitForSelector('#password input[type="password"]', { visible: true });
    await page.type('#password input[type="password"]', "p1e2p1e2", { delay: 5 });
    await page.waitForSelector('#password input[type="password"]', { visible: true });
    await page.click('#passwordNext',wait);
    await page.click('#passwordNext',wait);
    await page.click('#passwordNext',wait);
    await page.click('#passwordNext',wait);
    await page.waitForNavigation();
    await page.screenshot({
        path: "googleLogin.jpg"
    });
    console.log("aqui ando");
    await page.goto("https://secure.indeed.com/account/login?hl=es_MX&co=MX&continue=https%3A%2F%2Fmx.indeed.com%2F&tmpl=desktop&service=my&from=gnav-util-homepage&jsContinue=https%3A%2F%2Fmx.indeed.com%2F&empContinue=https%3A%2F%2Faccount.indeed.com%2Fmyaccess",wait)
    await page.click("#login-google-button", wait);
    await page.waitForNavigation();
    await page.screenshot({
        path:"indeed.jpg",
    })
    await page.click("#EmployersPostJob",wait);
        
    await page.screenshot({
        path: "hola.jpg"
    });
    //busca el trabajo
    console.log(getArray);
    const search= getArray.values;
    console.log(search);
    await page.goto("https://employers.indeed.com/j#jobs?title="+search);

    let status = false;
    let listCandidates = [];
    
    listCandidates = await page.evaluate(()=>{
        const values2 = document.querySelectorAll(".HanselEmptyState-container");
        let listCandidates2 = [];
        let vacio = {};
        console.log(values2);
        if(values2.length == 1){
            array = null;
            console.log("Sí entró")
            status = true;
            vacio = {name:"Sr1", filtros: "Sr1", status: "Sr1"};
            listCandidates2.push(vacio);
        }else{
            console.log("No entró")
        }

        return listCandidates2;
    });

    const flag = await page.evaluate(()=>{
        let status = false;
        const values2 = document.querySelectorAll(".HanselEmptyState-container");
        if(values2.length == 1){
            status = true;
        }

        return status;
    });

    if(flag == false){
        await page.waitForSelector(".css-zsw846");

        const works = await page.evaluate(()=>{
            const values = document.querySelectorAll(".OneViewJobListItem-title-link");
            console.log(values);
            const array = [];
            values.forEach(element => {
                array.push(element.getAttribute('href'));
            });
            return array;
        });

        let text = await allCandidates(page,works);
        console.log(text);
        if(text.length > 0){
            await page.goto("https://employers.indeed.com"+text);
            await page.waitForSelector('.cpqap-CandidateCell-name-text');
            const pages = await page.evaluate(()=>{
                return  document.querySelectorAll(".cpqap-Pagination-page").length;
            })
            let candidates = [];
            let Pagination = [];
            for (let j=1; j<=pages+1;j++){
                Pagination.push('https://employers.indeed.com'+text+"&p="+j);
            }
            console.log(Pagination);
            for (const iterator of Pagination) {
                await page.goto(iterator);
                await page.waitForSelector(".cpqap-CandidateCell-name-text");
                let listCandidates = await page.evaluate(()=>{
                    const values = document.querySelectorAll(".cpqap-CandidateCell-name-text");
                    const array = [];
                    let i=0;
                    const filtros = document.querySelectorAll('.cpqap-ScreenerQuestions-preferred');
                        values.forEach(element=>{
                        let rfilter =[];
                        rfilter = filtros[i].innerText.split(" ",1);
                        console.log(rfilter)
                        array.push({
                            id:element.getAttribute('href'),
                            filtros: rfilter[0],
                        });
                        i++;
                    })
                    return array;
                })
                console.log(listCandidates);
                candidates.push(listCandidates);
            }
            console.log(candidates);
            let i=0;
            for (let element of candidates) {
                i++;
                element=await singleCandidate(page,element);
            }
            for (const iterator of candidates) {
                for (const element of iterator) {
                    listCandidates.push(element);
                }
            }
        }else{
            let vacio = {name:"Sr1", filtros: "Sr1", status: "Sr1"};
            listCandidates.push(vacio);
        }
        
    }
    
    
    res.writeHead(202,{
        "Content-type": "application/json",
    });
    console.log(listCandidates);
    res.end(JSON.stringify(listCandidates));
    console.log("hola")
    await browser.close()
})
module.exports = app;

async function allCandidates(page,works){
    let text;
    for (const element of works) {
        await page.goto('https://employers.indeed.com/'+element);
        //css-16edfe3
        await page.waitForSelector(".css-14yg0vp");
        
        text = await page.evaluate(()=>{
            const array = [];
            if(document.querySelector(".css-f0xprd")){
                const values = document.querySelectorAll(".css-f0xprd");
                console.log("Mostrando el Values " + values);
                array.push(values[1].getAttribute('href'));
                console.log("Mostrando el array " + array);
            }else{
                console.log("No existe, perdón")
            }
            
            return array;
        });
    }
    return text;
} 
async function singleCandidate(page,candidates){
    console.log(candidates)
    let i=0;
    for (let element of candidates) {
      i++;
      await page.goto("https://employers.indeed.com/c"+element.id);
      await page.waitForSelector(".hanselNamePlate-leftPanel h1");
      await page.waitForSelector(".body");
      const singlepeople = await page.evaluate(()=>{
        const singlepeople = {};
        singlepeople.name = document.querySelector(".hanselNamePlate-leftPanel h1").innerText;
        if(document.querySelector("#resume-contact")){
          singlepeople.status = "Rechazado";
        }else{
          singlepeople.status = "Aceptado";
        }
        return singlepeople;
      })
      element.name=singlepeople.name;
      element.status=singlepeople.status;
      console.log(element);    
    }
    console.log(i);
    return candidates;
  } 
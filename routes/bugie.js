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
    console.log("hola");
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
            '--disable-gpu',
            '--disable-dev-shm-usage',
            '--disable-setuid-sandbox',
            '--no-first-run',
            '--no-sandbox',
            '--no-zygote',
            '--deterministic-fetch',
            '--disable-features=IsolateOrigins',
            '--disable-site-isolation-trials',
            // '--single-process',
        ],
        headless:false,
    })
    console.log("vivito");
    //abrir navegador
    let page = await browser.newPage();
    console.log("va");
    await page.setDefaultNavigationTimeout(0); 
    
    //linea bendita que se hace pendejo al google jajajaja
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36');
    
    //Convierte el JSON de Bugie en un arreglo para leer
    let get = req.query.options || '';
    let getArray = [];
    getArray=JSON.parse(get);
    console.log("va");
    await page.goto("https://accounts.google.com/signin/v2/identifier?hl=es-419&passive=true&continue=https%3A%2F%2Fwww.google.com%2Fsearch%3Fq%3Dgoogle%26oq%3Dgoo%26aqs%3Dchrome.0.0i131i433i512j0i433i512j0i131i433i512j69i57j0i433i512l6%26pf%3Dcs%26sourceid%3Dchrome%26ie%3DUTF-8&ec=GAZAAQ&flowName=GlifWebSignIn&flowEntry=ServiceLogin",wait)
    await page.waitForSelector('#identifierId',wait);
    await page.type('#identifierId', "emmanuelibarratorres14@gmail.com", { delay: 5 });
    await page.click('#identifierNext');
    console.log("va");
    await page.waitForSelector('#password input[type="password"]', { visible: true });
    await page.type('#password input[type="password"]', "1hf425wx", { delay: 5 });
    await page.waitForSelector('#passwordNext');
    console.log("va");
    await page.click('#passwordNext',wait);
    
    console.log("aqui ando");
    await page.screenshot({
        path: "prueba1.jpg"
        });
    await page.goto("https://secure.indeed.com/account/login?hl=es_MX&co=MX&continue=https%3A%2F%2Fmx.indeed.com%2F&tmpl=desktop&service=my&from=gnav-util-homepage&jsContinue=https%3A%2F%2Fmx.indeed.com%2F&empContinue=https%3A%2F%2Faccount.indeed.com%2Fmyaccess",wait)
    await page.click("#login-google-button", wait);
    await page.waitFor(10000);
    await page.screenshot({
        path: "prueba2.jpg"
        });
    
    await page.waitForSelector("#EmployersPostJob");
    console.log("sigo vivo")
    console.log("aun aqui");
    await page.click("#EmployersPostJob");        
    console.log("aun aqui");
    await page.screenshot({
    path: "hola1.jpg"
    });
    //busca el trabajo
    console.log(getArray);
    const search= getArray.values;
    console.log(search);
    await page.screenshot({path:"trabado1.jpg"})
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
    console.log("hola");
    await browser.close();
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
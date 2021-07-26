const express = require('express');
const wait = {waitUntil: 'domcontentloaded'};
const puppeteer = require('puppeteer-extra');
const cors = require("cors");
const plugin = require("puppeteer-extra-plugin-stealth");
puppeteer.use(plugin());
const app = express();
var corsOptions = {
    origin: 'http://localhost:3000',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

app.options('/products/:id', cors()) // enable pre-flight request for DELETE request
app.use('/', async (req, res) => {
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
    const page = await browser.newPage()
    //linea bendita que se hace pendejo al google jajajaja
    await page.setDefaultNavigationTimeout(0); 
    await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/51.0.2704.103 Safari/537.36')
    await page.goto("https://accounts.google.com/AddSession/identifier?hl=es&continue=https%3A%2F%2Fmail.google.com%2Fmail&service=mail&ec=GAlAFw&flowName=GlifWebSignIn&flowEntry=AddSession",wait)
    await page.waitForSelector('#identifierId',wait);
    await page.type('#identifierId', "daniel.growthy@gmail.com", { delay: 5 });
    await page.click('#identifierNext');
    await page.waitForSelector('#password input[type="password"]', { visible: true });
    await page.type('#password input[type="password"]', "3hf435wx", { delay: 5 });
    await page.click('#passwordNext',wait);
    await page.click('#passwordNext',wait);
    await page.waitForNavigation();
    await page.screenshot({
    path: "googleLogin.jpg"
    });

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
    const search="psicologo";
    await page.goto("https://employers.indeed.com/j#jobs?title="+search);
    
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
    console.log("hola");
    let text = await allCandidates(page,works);
    console.log(text);
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
        array.push({
            id:element.getAttribute('href'),
            filtros: filtros[i].innerText,
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
    /* const person = await singleCandidate(page,candidates[1]);
    console.log(person); */
    console.log(candidates);
    let listCandidates=[];
    for (const iterator of candidates) {
        for (const element of iterator) {
            listCandidates.push(element);
        }
    }
    await browser.close()
    /* const person = await singleCandidate(page,candidates[1]);
    console.log(person); *
    /* await browser.close() */
    // Respond with the image
    res.writeHead(200, {
        "Content-type": "application/json",
    });
    res.end(JSON.stringify(listCandidates));

    await browser.close();
})
module.exports = app;
async function allCandidates(page,works){
    let text;
    for (const element of works) {
    await page.goto('https://employers.indeed.com/'+element);
    await page.waitForSelector(".css-f0xprd");
    text = await page.evaluate(()=>{
    const values = document.querySelectorAll(".css-f0xprd");
    const array = [];
    array.push(values[1].getAttribute('href'));
    console.log(array);
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
      console.log(element)
      break;
    }
    console.log(i);
    return candidates;
  } 
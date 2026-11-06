// Browser component test with simulated authenticated API responses.
// This is deliberately separate from a production login/persistence test.
const fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const ts=require('typescript'),assert=require('node:assert/strict');
const {chromium}=require(require.resolve('playwright',{paths:[process.env.HOMEFLOW_ROOT || 'C:/Users/wingo/homeflow-crm']}));
async function main(){
  const source=ts.transpileModule(fs.readFileSync('app/components/admin/InquiryManagement.tsx','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  const fixture=`
    const row={id:'test-inquiry',name:'Teszt Érdeklődő',email:'teszt@example.invalid',phone:'+36301234567',message:'Érdeklődöm a debreceni ingatlan iránt.',propertyId:'',propertyTitle:'',createdAt:'2026-11-06T10:00:00Z',status:'new',notes:'Megőrzendő megjegyzés',viewingAt:'',version:0,delivery:'sent',crmDelivery:'failed'};
    window.calls=[];
    const module={exports:{}};
    function require(name){
      if(name==='react') return React;
      if(name==='react/jsx-runtime') return {jsx:(type,props)=>React.createElement(type,props),jsxs:(type,props)=>React.createElement(type,props)};
      if(name==='next/link') return {default:props=>React.createElement('a',props)};
      if(name==='react-hot-toast') return {default:{success:()=>{},error:()=>{}}};
      if(name.endsWith('uniqueInquiries')) return {uniqueInquiries:items=>items};
      if(name.endsWith('managementClient')) return {managementRequest:async(url,body,method)=>{
        calls.push({url,body,method});
        if(method==='POST'){row.crmDelivery='sent';return {success:true,crmDelivery:'sent'};}
        return {inquiries:url.includes('legacy')?[]:[{...row}],cursor:null};
      }};
      throw Error(name);
    }
    (function(require,module,exports){${source}\n})(require,module,module.exports);
    ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(module.exports.default));
  `;
  const css=fs.readdirSync('.next/static/css').filter(p=>p.endsWith('.css')).map(p=>fs.readFileSync(path.join('.next/static/css',p),'utf8')).join('\n');
  const server=http.createServer((req,res)=>{
    res.setHeader('content-type',req.url==='/'?'text/html; charset=utf-8':'text/javascript; charset=utf-8');
    if(req.url==='/react.js') return res.end(fs.readFileSync('node_modules/react/umd/react.development.js'));
    if(req.url==='/react-dom.js') return res.end(fs.readFileSync('node_modules/react-dom/umd/react-dom.development.js'));
    if(req.url==='/fixture.js') return res.end(fixture);
    res.end('<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1"><style>'+css+'</style><div id="root"></div><script src="/react.js"></script><script src="/react-dom.js"></script><script src="/fixture.js"></script>');
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try{
    browser=await chromium.launch({channel:'msedge',headless:true});
    const page=await browser.newPage({viewport:{width:390,height:844}}),errors=[];
    page.on('pageerror',e=>{errors.push(e.message);console.error('BROWSER:',e.message);});
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.getByText('HomeFlow: sikertelen továbbítás').waitFor();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
    await page.screenshot({path:'outputs/homeflow-v6/mobile-crm-retry.png',fullPage:true});
    await page.getByRole('button',{name:'HomeFlow-továbbítás újrapróbálása'}).click();
    await page.getByText('HomeFlow: átvétel visszaigazolva').waitFor();
    assert.equal(await page.getByRole('button',{name:'HomeFlow-továbbítás újrapróbálása'}).count(),0);
    assert.equal(await page.getByRole('textbox',{name:'Belső megjegyzés'}).inputValue(),'Megőrzendő megjegyzés');
    const calls=await page.evaluate(()=>window.calls.filter(c=>c.method==='POST'));
    assert.deepEqual(calls,[{url:'/api/admin/inquiries/crm',body:{id:'test-inquiry'},method:'POST'}]);
    assert.deepEqual(errors,[]);
    await page.screenshot({path:'outputs/homeflow-v6/mobile-crm-sent.png',fullPage:true});
    console.log('PASS: mobile 390px, retry request, acknowledgement, retained notes, no page errors');
  } finally {if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
}
main().catch(error=>{console.error(error);process.exitCode=1;});

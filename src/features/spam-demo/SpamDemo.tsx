import { useRef,  useState, } from 'react'
import { useNavigation } from '@/hooks/useNavigation'
import { useTranslationContext } from '@/i18n'
import { PATHS } from '@/routes/paths'
import * as ort from 'onnxruntime-web';

let sessionFull : any = null;
const mergesPath : string = "public/vocab/merges_all_18k.txt";
const vocabPath  : string  = "public/vocab/vocab_all_18k.json";
const modelPath : string = "public/onnx/mail_180226_02.onnx";
const wasmPath: string = '/node_modules/onnxruntime-web/dist/';

ort.env.wasm.wasmPaths = wasmPath;
const LENTOKENS = 128;
const finalVocab = await loadVocab(vocabPath);
const vstr = await v2str(vocabPath);
const mstr = await m2str(mergesPath);

try {
  sessionFull = await ort.InferenceSession.create(modelPath, {
  executionProviders: ['wasm']
});
  console.log("Spam-detector Model loaded!");
} catch (e) {
  console.error("Failed to load full model:", e);
}
const tensorial = new ort.Tensor("int64",new BigInt64Array(LENTOKENS),[1,LENTOKENS]);
const atten =  new ort.Tensor('float32',new Float32Array(LENTOKENS),[1,LENTOKENS])
const input_tensor = { 
    input: tensorial,
    attention: atten,
};

async function loadTokenizer() {
  return new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = 'public/wasm/tokenizer/tokenizer.js'
    script.onload = () => {
      (window as any).Module({ 
        onRuntimeInitialized() {
          resolve(this)
        }
      })
    }
    document.body.appendChild(script)
  })
}

const tokenizer : any = await loadTokenizer()


async function loadVocab(path: string) {
  const response = await fetch(path);
  let text = await response.text();
  text = text.slice(1,-1);
  const rows = text.trim().split('\n').map(row => row.split(': '));
  const dict = new Map();
  for(let i =0; i< rows.length; i++){
    let key = rows[i][1];
    let key_int = BigInt(Number(key.replace(",","").trim()));
    let value :string = rows[i][0];
    let value1 = value.replace("\"","").trim();
    let value2 = value1.replace("\"","").trim();
    dict.set(key_int,value2);
  }
  return dict;
}


async function v2str(path: string) {
  const response = await fetch(path);
  let text = await response.text();
  text = text.slice(2,-2);
  const text_split = text.split("\n");
  for(let i=0; i< text.length; i++){
    if (typeof text_split[i] == "string"){
      text_split[i] = text_split[i].trim();
      if(text_split[i].endsWith(",")){
        text_split[i] = text_split[i].slice(0,-1);
      }
      text_split[i] = text_split[i].replaceAll("\"","");
      text_split[i] = text_split[i].replaceAll(": "," ");
      const couple = text_split[i].split(" ");
      text_split[i] = couple[1].concat(" ",couple[0]);
    }
  }
  return text_split;
}


async function m2str(path: string) {
  const response = await fetch(path);
  let text = await response.text();
  const text_split = text.split("\n").slice(0,-1);
  for(let i=0; i< text.length; i++){
    if(typeof text_split[i] == "string"){
      text_split[i] = text_split[i].trim();
    }
  }
  return text_split;
}


function runTokenizer(text: string) :[BigInt64Array, Float32Array] {
  
  const vocabPtr = vstr.map(str => {
    const utf8Length = tokenizer.lengthBytesUTF8(str);
    const ptr = tokenizer._malloc(utf8Length + 1);
    tokenizer.stringToUTF8(str, ptr, utf8Length+ 1);
    return ptr;
  });
  const vPtr = tokenizer._malloc(vstr.length * 4);
  vocabPtr.forEach((ptr, i) => {
        tokenizer.setValue(vPtr + i * 4, ptr, '*');
    });

  const mergePtr = mstr.map(str => {
    const utf8Length = tokenizer.lengthBytesUTF8(str);
    const ptr = tokenizer._malloc(utf8Length + 1);
    tokenizer.stringToUTF8(str, ptr, utf8Length + 1);
    return ptr;
  });
  const mPtr = tokenizer._malloc(mstr.length * 4);
  mergePtr.forEach((ptr, i) => {
        tokenizer.setValue(mPtr + i * 4, ptr, '*');
    });

  const utf8Length = tokenizer.lengthBytesUTF8(text);
  const textPtr = tokenizer._malloc(utf8Length + 1);
  tokenizer.stringToUTF8(text, textPtr, utf8Length + 1);

  const tokensPtr = tokenizer._malloc(LENTOKENS * 4);
  const maskPtr =   tokenizer._malloc(LENTOKENS * 4);  
  tokenizer._tokenizer(tokensPtr, maskPtr, textPtr, vPtr, mPtr, LENTOKENS, vstr.length, mstr.length);
  
  const tokens = new Int32Array(tokenizer.HEAP32.buffer, tokensPtr, LENTOKENS);
  const mask = new Float32Array(tokenizer.HEAPF32.buffer, maskPtr, LENTOKENS);
  const tokens64 = new BigInt64Array(LENTOKENS);
  for(let i=0 ;i<LENTOKENS;i++){
    tokens64[i] = BigInt(tokens[i]);
  }

  tokenizer._free(tokensPtr);
  tokenizer._free(maskPtr);
  tokenizer._free(textPtr);
  vocabPtr.forEach(ptr => tokenizer._free(ptr));
  tokenizer._free(vPtr);
  mergePtr.forEach(ptr => tokenizer._free(ptr));
  tokenizer._free(mPtr);
  return [tokens64, mask];
}


function color(v: any) {
  const g = Math.round(255 * v);
  return `rgb(${255-g},${255-g},255)`;
}


function provide_explanation(s_result: string, relevancies: any, outputTokens: any, container: any){
  let strexp = `<span style ="color:white"> Your document was labeled as `+ s_result+ ` because of the blue tokens: \n </span>`;
  for(let i = 0; i<LENTOKENS;i++){  
    strexp = strexp.concat(`<span style="color:${color(relevancies[i])}"> <b> ${finalVocab.get(outputTokens[i])} </b> </s> </span> `);
  }
  container(strexp);
}


async function spamOrHam(message: string | undefined, result: any, explanation: any){
  if (message) {
    let messagec = message.replaceAll("\n"," ")
    console.time("Token");
    const [outputTokens, atten] =  runTokenizer(messagec);
    console.timeEnd("Token")
    console.time("Tensor");
    input_tensor.input.data.set(outputTokens);
    input_tensor.attention.data.set(atten);
    console.timeEnd("Tensor")
    console.time("Inferencia")
    let running = null;
    running = await sessionFull.run(input_tensor);
    console.timeEnd("Inferencia")
    const spam = running.output.data;
    let relevancies;
    if (Object.values(running).length > 1){
      relevancies = running.saliencies.data;
    }
    console.log("Salida del modelo: ", spam);
    let s_result = "";
    if(spam[0]>spam[1]){
      result("This mail is: ham");
      s_result= "ham";
    }
    else{
      result("The mail is: spam");
      s_result = "spam";
    }
    if (Object.values(running).length > 1 && s_result == "spam"){
      provide_explanation(s_result, relevancies, outputTokens, explanation);
    }
  }
}

interface MailViewProps {
  folder: string
}

const SpamDemo = ({ folder }: MailViewProps ) => {
  const { translate } = useTranslationContext()
  const { goTo } = useNavigation()
  const textInput = useRef<HTMLTextAreaElement>(null)
  const [lab, setText] = useState('')
  const [expl, setExpl] = useState('')

    const goToInbox = () => {
    goTo(PATHS.inbox)
  }

  const goToTrash = () => {
    goTo(PATHS.trash)
  }

  const goToDemo = () => {
    goTo(PATHS.demo)
  }

  const evalDemo = () => {
    const message  = textInput.current?.value
    spamOrHam(message,setText,setExpl);
  }

  return (
    <div>
      <p>{translate('sidenav.inbox')}</p>
      <p>Current folder: {folder}</p>
      <label >Content: </label>
      <br></br>
      <textarea ref={textInput} style={{ width: '100%', height: '300px' }} placeholder="Content of the message..."/>
      <div>
        <button onClick={evalDemo}>Evaluate</button>
        <label id="result">The mail is: {lab}</label>
      </div>
      <label dangerouslySetInnerHTML={{ __html: expl }}  />
      <div id="output">
      </div>
      <div className="flex flex-row gap-2">
        <button onClick={goToInbox}>Go To Inbox</button>
        <button onClick={goToTrash}>Go To Trash</button>
        <button onClick={goToDemo}>Go To Spam-demo</button>
      </div>
    </div>
  )
}

export default SpamDemo

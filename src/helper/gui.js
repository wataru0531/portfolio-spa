
// gui

const gui = {
  init,
  add,
}

let lilGUI = null;

// bootstrapで初期化
async function init(){
  const { default: GUI } = await import("lil-gui");
  // console.log(GUI);

  lilGUI = new GUI();
}


// 各フォルダ内のindex.jsで初期化
function add(_callback){

  // ligGUIが開発環境で初期化されていた場合、lilGUIが渡ってくる
  if(lilGUI){
    _callback(lilGUI);
  }
}


export { gui };
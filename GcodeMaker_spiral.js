function output(){
	var x_length, y_length;         //面出し範囲[mm]
    var diam, radius;               //スピンドル直径[mm], 半径[mm]
	var move_speed, descend_speed;  //水平送り速度[mm/min], 鉛直送り速度[mm/min]
    var motor_rpm;                  //スピンドル回転数[rpm]
	var depth, height;              //切削深さ[mm], 空中移動時高さ[mm]
    
    
    //入力値チェック
    var values = document.getElementsByTagName("input");
    var setting_flag = 0;           //設定値入力欄チェックフラグ 不適検知して1
    var form_numbers = " ";         //不適入力欄記録用 as 文字列
    
    for(var i=0; i<values.length; i++){
        if(!(parseFloat(values[i].value, 10) > 0)){
            form_numbers += (i+1) + " ";
            setting_flag = 1;
        }
    }
    if(setting_flag){
        alert(form_numbers + "番目の値が正しくありません");
        return;
    }
    
    //各変数へ代入
    x_length        = parseFloat(values[0].value, 10);
    y_length        = parseFloat(values[1].value, 10);
    diam            = parseFloat(values[2].value, 10);
    move_speed      = parseFloat(values[3].value, 10);
    descend_speed   = parseFloat(values[4].value, 10);
    motor_rpm       = parseFloat(values[5].value, 10);
    depth           = parseFloat(values[6].value, 10);
    height          = parseFloat(values[7].value, 10);
    
    radius = diam / 2;
    
	var overlap_width;      　               //重ね幅[mm]
    var ROOT2 = 1.4;                        //約√2(作業用定数)
    overlap_width = radius / ROOT2 + 0.2;   //角が残らないように重ね幅設定 +α
    
    alert("切削対象には\n( " + (x_length + diam) + ", " + (y_length + diam) + " )[mm]\nの広さが必要です");
    
    ////////////////////////////////////////////////////////////////////////////
    //原点へ移動 -> 外周（一週目）
    var output = document.getElementById("output_textarea");
    output.value = "";
    
    output.value += "G01 Z5.000 F500\n";
    output.value += "G01 X0.000 Y0.000 F500\n";
    output.value += "M03 S" + motor_rpm + "\n";
    output.value += "G01 Z-" + depth.toFixed(3) + " F" + descend_speed + "\n";  //左下角欠き
    output.value += "G01 F" + move_speed + "\n";
    
    output.value += "G01 X" + radius.toFixed(3) + " Y" + radius.toFixed(3) + "\n";
    output.value += "G01 Y" + (y_length - radius).toFixed(3) + "\n";
    output.value += "G01 X0.000 Y" + y_length.toFixed(3) + "\n";    //左上角欠き
    output.value += "G01 X" + radius.toFixed(3) + " Y" + (y_length - radius).toFixed(3) + "\n";
    output.value += "G01 X" + (x_length - radius).toFixed(3) + "\n";
    output.value += "G01 X" + x_length.toFixed(3) + " Y" + y_length.toFixed(3) + "\n";  //右上角欠き
    output.value += "G01 X" + (x_length - radius).toFixed(3) + " Y" + (y_length - radius).toFixed(3) + "\n";
    output.value += "G01 Y" + radius.toFixed(3) + "\n";
    output.value += "G01 X" + x_length.toFixed(3) + " Y0.000\n";    //右下角欠き
    output.value += "G01 X" + (x_length - radius).toFixed(3) + " Y" + radius.toFixed(3) + "\n";
    output.value += "G01 X" + radius.toFixed(3) + " Y" + radius.toFixed(3) + "\n";  //左下角
    
    var move_width      //移動幅[mm]
    move_width = diam - overlap_width;
    
    var done_width      //外周からスピンドル中心までの距離[mm]
    done_width = radius;
    
    //ぐるぐる
    var laps;
    if(x_length < y_length){
        laps = Math.floor(((x_length / 2) - radius) / move_width);
        //下辺からループスタート
        for(var i=0; i<laps; i++){
            done_width += move_width;
            output.value += "G01 X" + done_width.toFixed(3) + "\n";
            output.value += "G01 Y" + (y_length - done_width).toFixed(3) + "\n";
            output.value += "G01 X" + (x_length - done_width).toFixed(3) + "\n";
            output.value += "G01 Y" + done_width.toFixed(3) + "\n";
        }
        output.value += "G01 X" + (x_length / 2).toFixed(3) + "\n";
        output.value += "G01 Y" + (y_length - done_width - move_width).toFixed(3) + "\n";
    }else{
        laps = Math.floor(((y_length / 2) - radius) / move_width);
        output.value += "G01 X" + (done_width + move_width).toFixed(3) + "\n";        
        //左辺からループスタート
        for(var i=0; i<laps; i++){
            done_width += move_width;
            output.value += "G01 Y" + (y_length - done_width).toFixed(3) + "\n";
            output.value += "G01 X" + (x_length - done_width).toFixed(3) + "\n";
            output.value += "G01 Y" + done_width.toFixed(3) + "\n";
            output.value += "G01 X" + done_width.toFixed(3) + "\n";
        }
        output.value += "G01 Y" + (y_length / 2).toFixed(3) + "\n";
        output.value += "G01 X" + (x_length - done_width - move_width).toFixed(3) + "\n";
    }
    
    //スピンドル上げて原点移動して終了
    output.value += "G01 Z5.00 F200\n";
	output.value += "M06\n";
	output.value += "G01 X0.000 Y0.000 F500\n";
    ////////////////////////////////////////////////////////////////////////////
    
    //加工所要時間予想（わりとアバウト）
    var total                           //切削総距離[mm]
    if(x_length < y_length)
        total = (x_length * 2) * (laps + 2) + (y_length * 2 - x_length) * (laps + 2);
    else
        total = (y_length * 2) * (laps + 2) + (x_length * 2 - y_length) * (laps + 2);
    
    var duration = total / move_speed;  //予想所要時間[min]
    
    document.getElementById("duration").innerHTML = Math.floor(duration);
    
    //結果全選択
    output.select();
}

function save(){
    var data = document.getElementById("output_textarea").value;
    var href = "data:application/octet-stream," + encodeURIComponent(data);
    location.href = href;
}
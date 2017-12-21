let conn;
const peer = new Peer({ key: 'viswrd6u6hg58kt9', debug: 3});

peer.on("open", function(){

  // console.log(text(peer.id))
  $("#my-id").text(peer.id);
});

peer.on('connection', function(connection){
　
  conn = connection;

  conn.on("open", function() {
      $("#peer-id").text(conn.id);
  });

  conn.on("data", onRecvMessage);
});

function onRecvMessage(data) {
  $("#messages").append($("<p>").text(conn.id + ": " + data).css("font-weight", "bold"));
}

$(function() {
  $("#connect").click(function() {
      var peer_id = $('#peer-id-input').val();

      conn = peer.connect(peer_id);

      conn.on("open", function() {
          $("#peer-id").text(conn.id);
      });

      conn.on("data", onRecvMessage);
  });

  $("#send").click(function() {
      let message = $("#message").val();

      conn.send(message);

      $("#messages").append($("<p>").html(peer.id + ": " + message));
      $("#message").val("");
  });

  $("#close").click(function() {
      conn.close();
  });
});
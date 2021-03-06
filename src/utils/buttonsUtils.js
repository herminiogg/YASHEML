var imgs = require("./imgs.js"),
    yutils = require("yasgui-utils"),
    utils = require("./baseUtils.js"),
    $ = require("jquery"),
    Codemirror = require('codemirror');

var drawButtons = function(yashe){

    yashe.buttons = $("<div class='yashe_buttons'></div>").appendTo($(yashe.getWrapperElement()));
 

    /**
     * draw upload button
     */
    var uploadButton = $("<div>", {
      class: "downloadBtns"
    }).append($('<input type="file" accept=".shexml" name="file-1[]" id="file-1" class="inputfileBtn" data-multiple-caption="{count}'
    +'files selected" multiple /><label id="uploadBntLabel" for="file-1">'+imgs.upload+'</label>')
    .addClass("yashe_uploadBtn")
    .attr("title", "Upload you ShExML file")
    .on('change',()=>{utils.readFile(yashe)}));
    yashe.buttons.append(uploadButton);
  
  
    /**
     * draw download button
     */
  
    var downloadButton = $("<div>", {
      class: "downloadBtns"
    })
      .append(
        $(yutils.svg.getElement(imgs.download))
          .addClass("yashe_downloadBtn")
          .attr("title", "Download File")
          .attr("id", "downloadBtn")
          .click(function() {          
            var textFileAsBlob = new Blob([ yashe.getValue() ], { type: 'text/shexML' });
            var fileNameToSaveAs = "document.shexml";
  
            var downloadLink = document.createElement("a");
            downloadLink.download = fileNameToSaveAs;
            downloadLink.innerHTML = "Download File";
            if (window.URL != null) {
              // Chrome allows the link to be clicked without actually adding it to the DOM.
              downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
            } else {
              // Firefox requires the link to be added to the DOM before it can be clicked.
              downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
              downloadLink.onclick = destroyClickedElement;
              downloadLink.style.display = "none";
              document.body.appendChild(downloadLink);
            }
            downloadLink.click();
            Codemirror.signal(yashe,'download');
          })
      );
    yashe.buttons.append(downloadButton);
  
  
    /**
     * draw copy button
     */
  
    var copyButton = $("<div>", {
      class: "downloadBtns"
    })
      .append(
        $(yutils.svg.getElement(imgs.copy))
          .addClass("yashe_downloadBtn")
          .attr("id", "copyBtn")
          .attr("title", "Copy to the clipboard")
          .click(function() { 
              Codemirror.signal(yashe,'copy');
          }))
    yashe.buttons.append(copyButton);
  

   
    /**
     * draw delete button
     */
    var deleteButton = $("<div>", {
      class: "downloadBtns"
    }).append($(yutils.svg.getElement(imgs.delete))
    .addClass("yashe_deletedBtn")
    .attr('id','deleteBtn')
    .attr("title", "Delete content")
    .click(function() { 
              yashe.setValue("")
              Codemirror.signal(yashe,'delete');
          }));

    yashe.buttons.append(deleteButton);


    /**
     * theme button
     */
    var themeButton = $("<div>", {
      class: "downloadBtns"
    }).append($(yutils.svg.getElement(imgs.theme))
    .addClass("yashe_themeBtn")
    .attr('id','themeBtn')
    .attr("title", 'Change the theme')
    .click(function() { 
      
      var themeValue = 'wiki'
      var color = 'black'
      if(yashe.getOption('theme') == 'wiki'){
        themeValue='dark'
        color = 'white'
      }
      

      yashe.setOption("theme",themeValue)

      //Change fill of buttons
      $('#uploadBntLabel').css('fill', color)
      $('#downloadBtn').css('fill', color)
      $('#copyBtn').css('fill', color)
      $('#deleteBtn').css('fill', color)
      $('#themeBtn').css('fill', color)
      $('#fullBtn').css('fill', color)
      $('#smallBtn').css('fill', color)
 
      Codemirror.signal(yashe,'themeChange');
    }))

    yashe.buttons.append(themeButton);


    /**
       * draw fullscreen button   
    */
    var toggleFullscreen = $("<div>", {
      class: "fullscreenToggleBtns"
    })
      .append(
        $(yutils.svg.getElement(imgs.fullscreen))
          .addClass("yashe_fullscreenBtn")
          .attr("title", "Set editor full screen")
          .attr("id", "fullBtn")
          .click(function() {
            yashe.setOption("fullScreen", true);
            Codemirror.signal(yashe,'expandScreen');
          })
      )
      .append(
        $(yutils.svg.getElement(imgs.smallscreen))
          .addClass("yashe_smallscreenBtn")
          .attr("title", "Set editor to normal size")
          .attr("id", "smallBtn")
          .click(function() {
            yashe.setOption("fullScreen", false);
            Codemirror.signal(yashe,'colapseScreen');
          })
      );
    yashe.buttons.append(toggleFullscreen);
  

  }



module.exports = {
    drawButtons:drawButtons
}
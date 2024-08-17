/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

/* Custom JS für TSV */
/*jQuery('.typo3-neos-nodetypes-image a.lightbox, .typo3-neos-nodetypes-textwithimage a.lightbox').fancybox();*/

/* Anker Funktion */
/*
function jump(h){
    var top = document.getElementById(h).offsetTop;
    window.scrollTo(0, top);
    
    var url = location.href;
    location.href = "#"+h;
    history.replaceState(null,null,url);
}
*/

/* Fancybox */
jQuery('.tsv-schnait-fancyimage a.fancybox').fancybox();

/* Zoom Anpassung für kleine und mobile Geräte */

$(window).on('load resize', function() {
    if ($(window).width() < 768) {
      $('body').css('zoom', $(window).width() / 768);
    } else {
      $('body').css('zoom', 1);
    }
  });
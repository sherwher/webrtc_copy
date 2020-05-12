function heightSet(){
    var winHt=$(window).height();
    var sideTopHt=$('.side-menu-wrap .side-top').outerHeight();
    var sideBtmHt=$('.side-btm').outerHeight();
    var currentHt=winHt-sideTopHt-sideBtmHt;
    $('.side-menu-wrap').css({'height':winHt});
    $('.gnb-wrap').css({'min-height':currentHt});
  }
  
  $(heightSet);
  $(window).resize(function () {
      heightSet();
      
      $(window).trigger("window:resize");
  });
  
  // 하단 플로팅 버튼 여백
  function btmBtnPosition(){
      
      $( '.top-btn' ).hide();
      
      if($('section').height() > $('html').height()){
          
          $(window).scroll( function() {
              
              if ( $( this ).scrollTop() > 126 ) {
                  $( '.top-btn' ).fadeIn(100);
              } else {
                  $( '.top-btn' ).fadeOut(100);
              }
              
          } );
          
          $( '.top-btn' ).click( function() {
              
              $('body,html').animate( { scrollTop : 0 }, 200 );
              return false;
              
          });
  
         }else{
             
              $( '.top-btn' ).hide();
             
         }
      
      //하단 여백
      if($('.top-btn').length){
          
          $('section').addClass('scroll-down');
          
         }
  }
  
  $(function(){
      
      // 하단 플로팅 버튼 여백
      btmBtnPosition();
      
      // tab
      $('.tab-con').hide();
      $('.tab-con').eq(0).show();
      $('.tab-wrap .tab-list .tab-btn').on('click',function(e){
          e.preventDefault();
          $(this).closest('.tab-wrap').find('.tab-list').removeClass('active');
          $(this).parent().addClass('active');
          //var hrefs=$(this).attr('data-tab');
          //$('.tab-con').hide();
          //$('#' + hrefs).show();
      });
      
      // 팝업 닫기
      $('.pop-close').on('click',function(){
          $('.banner-pop-wrap, .layer-pop-wrap, .pop-dim').hide();
      });
  });
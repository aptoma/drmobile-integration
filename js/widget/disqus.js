define('js/widgets/disqus', ['alf'], function(Alf){
    "use strict";
    var $ = Alf.dom;

    return {
        selector: '.lp-widget-disqus',
        //selector: 'div',

        run: function(done){

            var $this = this.$el;
            var shortname = $this.attr('shortname');
            var query = $this.attr('data-query');
            $this.text('Loading comments data.');

            var disqusPublicKey = 'YCex0uNJaklBqFMvHEsdDpzev3uwEA15twKNaohtswM0VJK1DFq2Ise1ttoFsOoz';

            $.ajax({
                type: 'GET',
                url: "https://disqus.com/api/3.0/threads/details.jsonp",
                data: { api_key: disqusPublicKey, forum : shortname, 'thread:ident' : query },
                cache: false,
                dataType: 'jsonp',
                success: function (result) {
                  console.log(result);
                  if (result && result.response) {

                    var countText = " Comments";
                    var count = result.response.posts;

                    console.log(result.response);

                    if (count == 1)
                      countText = " Comment";
                    var shotText = 'Show ' + count + countText + '.';
                    $this.text(shotText)

                  }else {
                    $this.text('Be first to comment.');
                  }
                },
                error: function(){
                    $this.text('Be first to comment.');
                }
              });


            $this.click(function(){

                console.log('Comments for: ' + shortname + ' ' + query);

                var url = 'http://disqus.com/embed/comments?f='+shortname+'&t_i='+query+'&s_o=default';
                window.open(url, '_blank');

            });

            done();
        }
    };
});
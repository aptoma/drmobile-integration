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
            //$this.text('Kommentarer');

            var treshhold = 100;
            var skip = false;

            function openComments(){
                if(skip) {
                    console.log('block it');
                    return;
                }

                //console.log('Comments for: ' + shortname + ' ' + query);
                var url = 'http://disqus.com/embed/comments?f='+shortname+'&t_i='+query+'&s_o=default';
                app.bridge.trigger('closedBrowser', url);

                skip = true;
                setTimeout(function(){
                    skip = false;
                }, treshhold);

            }

            $this.tap(openComments);

            done();
        }
    };
});

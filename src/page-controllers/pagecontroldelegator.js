var PageControlDelegator = function() {

    this.issuePageController = new IssuePageController();
    this.labelPageController = new LabelPageController();

    this.AnalyticsContentForNewIssue = "/<user-name>/<repo-name>/issues/new";
    this.AnalyticsContentForExistingIssue = "/<user-name>/<repo-name>/issues/show";
    this.AnalyticsContentForNewLabels = "/<user-name>/<repo-name>/labels/index";
}

PageControlDelegator.prototype.cleanup = function() {
    this.issuePageController.cleanup();
}

PageControlDelegator.prototype.runPageController = function() {

    var location = document.head.querySelector("meta[name='analytics-location']");
    if(!location) {
        return false;
    }

    var locationContent = location.getAttribute("content");
    if(typeof(locationContent) !== "string"){
        return false;
    }

    switch(locationContent){
        case this.AnalyticsContentForNewIssue:
            this.issuePageController.runOnNewLabelsPage();
            return true;
        case this.AnalyticsContentForExistingIssue:
            this.issuePageController.runOnExistingLabelsPage();
            return true;
        case this.AnalyticsContentForNewLabels:
            this.labelPageController.run();
            return true;
        default:
            break;
    }
    
    return false;
}

PageControlDelegator.prototype.run = function() {
    this.cleanup();
    this.runPageController();
}

PageControlDelegator.prototype.attachUrlListener = function() {
    chrome.runtime.onMessage.addListener( function(request, sender, sendResponse) {
        $(document).ready(this.run.bind(this));
    }.bind(this));
}

// Singleton factory for page delegator
var PageControlDelegatorSingleton = (function(){
    var instance;
    return {
        attachUrlListener: function() {
            if(!instance){
                instance = new PageControlDelegator();
                instance.attachUrlListener();
                return true;
            }
            return false;
        }
    };
})();

// main
PageControlDelegatorSingleton.attachUrlListener();
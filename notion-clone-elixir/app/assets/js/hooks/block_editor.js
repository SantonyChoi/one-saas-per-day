const BlockEditor = {
  mounted() {
    this.handleKeyDown = this.handleKeyDown.bind(this);
    window.addEventListener('keydown', this.handleKeyDown);
    
    // 이벤트 핸들러 등록 시 타겟 요소 저장
    this.el._phxHookTarget = this;
  },

  destroyed() {
    window.removeEventListener('keydown', this.handleKeyDown);
  },

  handleKeyDown(event) {
    // 편집 중인 요소가 있는 경우에는 이벤트를 처리하지 않음
    if (document.activeElement.tagName === 'INPUT' || 
        document.activeElement.tagName === 'TEXTAREA') {
      return;
    }
    
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.pushEventTo(this.el, 'add_block', {});
    }

    if (event.key === 'Escape') {
      this.pushEventTo(this.el, 'stop_editing', {});
    }
  }
};

export default BlockEditor; 
import Vue from 'vue';
import Vuex from 'vuex';
import request from '@/utils/request';
import { translateEntry } from '@/utils/tool';

Vue.use(Vuex);
export default new Vuex.Store({
    state: {
        limit: 10,
        max_id: 0,
        loading: true,
        messageList: [],
        pinnedMessage: {},
    },
    mutations: {
        setMaxID(state, max_id) {
            state.max_id = max_id;
        },
        changeLoading(state, status) {
            state.loading = status;
        },
        setMessageList(state, { list, isAuto }) {
            if (isAuto) {
                state.messageList = list;
                return;
            }
            state.messageList.push(...list);
        },
        setPinnedMessage(state, msg) {
            state.pinnedMessage = msg;
        },
    },
    actions: {
        // 如果是自动刷新调用的接口，那么不传max_id
        requestData(context, isAuto = false) {
            return request({
                limit: context.state.limit,
                max_id: isAuto ? 0 : context.state.max_id,
            }).then(res => {
                let pinnedMessage = res.pinned_message;

                if (pinnedMessage.entities) {
                    pinnedMessage.message = translateEntry(
                        pinnedMessage.message,
                        pinnedMessage.entities
                    );
                }
                context.commit('setPinnedMessage', {
                    message: pinnedMessage.message,
                    date: pinnedMessage.edit_date || pinnedMessage.date,
                });

                res = res.messages;
                const temp = [];
                let index = 0;
                for (let i in res) {
                    const item = res[i];
                    if (item.message && item.message.trim()) {
                        item['index'] = index++;

                        // 转换结尾的来源文本为链接
                        if (item.entities) {
                            item.message = translateEntry(
                                item.message,
                                item.entities
                            );
                        }
                        item.message = item.message.replace(/^#/, '#### #');
                        temp.push(item);
                    }
                }
                context.commit('setMaxID', temp[temp.length - 1].id);
                context.commit('setMessageList', {
                    list: temp,
                    isAuto,
                });
                context.commit('changeLoading', false);
            });
        },
    },
    strict: true,
});

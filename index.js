(function (root, factory) {
    /* istanbul ignore next */
    if (typeof root.define === 'function' && root.define.amd) {
        // AMD. Register as an anonymous module.
        root.define(['exports'], factory);
    } else if (typeof module === 'object') {
        // CommonJS
        module.exports = factory();
    } else {
        // Browser globals
        root[factory.name] = factory();
    }
}(this, function diff() {

    var TRACK_BY_FIELD = '$$listDiffHash';

    var DIFF_NOT_MODIFIED = 0;
    var DIFF_CREATED = 1;
    var DIFF_MOVED = 2;
    var DIFF_DELETED = -1;

    var lastUniqueId = 0;

    /**
     * Returns auto incremental unique ID as an integer.
     * @returns {number}
     */
    function getUniqueKey() {
        return lastUniqueId++;
    }

    /**
     * Returns x if it is not undefined, y otherwise.
     * @param x
     * @param y
     * @returns {*}
     */
    function maybe(x, y) {
        if (x !== undefined) return x;
        return y;
    }

    /**
     * @param {Array} list
     * @param {string} trackBy
     * @returns {{}}
     */
    function buildHashToIndexMap(list, trackBy) {
        var map = {};
        for (var i = 0; i < list.length; ++i) {
            var item = list[i];
            if (trackBy) {
                map[item[trackBy]] = i;
            } else {
                map[item] = i;
                addHashFieldToListItem(item, TRACK_BY_FIELD);
            }
        }
        return map;
    }

    /**
     * @param item
     * @param {string} trackBy
     * @returns {*} item
     */
    function addHashFieldToListItem(item, trackBy) {
        if (typeof item === 'object' && item !== null) {
            item[trackBy] = getUniqueKey();
        }
        return item;
    }

    /**
     * Calculates difference between two arrays.
     * List and prev. list:
     * 1 1 -> not changed
     * 2 2 -> not changed
     *   3 -> deleted
     * 4   -> created
     * 5   -> created
     *   6 -> deleted
     * Returns array of { item: T, state: int }.
     * Where state means: 0 - not modified, 1 - created, -1 - deleted.
     * @param {Array} list
     * @param {Array} prev
     * @param {string} [trackBy]
     */
    function diff(list, prev, trackBy) {
        var diff = [];
        var iList = 0;
        var iPrev = 0;

        if (!hashField) {
            hashListItems(list, DEFAULT_HASH_FIELD);
            hashListItems(prev, DEFAULT_HASH_FIELD);
        }

        var listIndexMap = buildIndexMap(list, hashField);
        var prevIndexMap = buildIndexMap(prev, hashField);

        for (; iList < list.length || iPrev < prev.length;) {
            var listItem = list[iList];
            var prevItem = prev[iPrev];

            if (iList >= list.length) {

                diff.push({ item: prevItem, state: DIFF_DELETED });
                ++iPrev;

            } else if (iPrev >= prev.length) {

                diff.push({ item: listItem, state: DIFF_CREATED });
                ++iList;

            } else if (listItem !== prevItem) {

                var prevItemIndex;
                var listItemIndex;

                if (trackBy) {
                    prevItemIndex = maybe(prevIndexMap[listItem[trackBy]], -1);
                    listItemIndex = maybe(listIndexMap[prevItem[trackBy]], -1);
                } else if (typeof listItem === 'object'
                        && typeof prevItem === 'object') {
                    prevItemIndex = maybe(prevIndexMap[TRACK_BY_FIELD], -1);
                    listItemIndex = maybe(listIndexMap[TRACK_BY_FIELD], -1);
                } else {
                    prevItemIndex = maybe(prevIndexMap[listItem], -1);
                    listItemIndex = maybe(listIndexMap[prevItem], -1);
                }

                var isCreated = prevItemIndex === -1;
                var isDeleted = listItemIndex === -1;

                // created
                if (isCreated) {
                    diff.push({ item: listItem, state: DIFF_CREATED });
                    ++iList;
                }

                // moved
                if (!isCreated && !isDeleted) {
                    if (iList === prevItemIndex) {
                        // for reference types with given trackBy
                        diff.push({
                            item: listItem,
                            state: DIFF_NOT_MODIFIED
                        });
                    } else {
                        diff.push({
                            item: listItem,
                            state: DIFF_MOVED,
                            oldIndex: prevItemIndex,
                            newIndex: iList
                        });
                    }
                    ++iList;
                    ++iPrev;
                }

                // deleted
                if (isDeleted) {
                    diff.push({ item: prevItem, state: DIFF_DELETED });
                    ++iPrev;
                }

            } else {
                diff.push({ item: listItem, state: DIFF_NOT_MODIFIED });
                ++iList;
                ++iPrev;
            }
        }

        return diff;
    }

    // exports ////////////////////////////////////////////////////////////////

    diff.TRACK_BY_FIELD = TRACK_BY_FIELD;
    diff.NOT_MODIFIED = DIFF_NOT_MODIFIED;
    diff.CREATED = DIFF_CREATED;
    diff.MOVED = DIFF_MOVED;
    diff.DELETED = DIFF_DELETED;
    diff.getUniqueKey = getUniqueKey;
    diff.buildHashToIndexMap = buildHashToIndexMap;

    return diff;
}));

var data = [{
            name: '张三',
            age: '20',
            address: '北京'
        },
        {
            name: '李四',
            age: '21',
            address: '上海'
        },
        {
            name: '王五',
            age: '22',
            address: '广州'
        }
    ]
    // 渲染函数
function render(data) {
    let $container = $('#container')

    // 清空现有的内容
    $container.html('')

    // 拼接table
    var $table = $('<table>')
    $table.append($('<tr><td>name</td><td>age</td><td>address</td></tr>'))
    data.forEach(function(item) {
        $table.append($('<tr><td>' + item.name + '</td><td>' + item.age + '</td><td>' + item.address + '</td></tr>'))
    })

    //渲染到页面
    $container.append($table)

}
$('#btn-change').click(function() {
    data[1].age = 30
    data[2].address = '深圳'
    render(data)
})
render(data)
# MacOS xx.app已损坏，无法打开。你应该将它移到废纸篓。

-----

`MacOS` 系统在安装应用时，有时候会出现 `xx.app已损坏，无法打开。你应该将它移到废纸篓。` 其原因是 `系统将其标记为来自不受信任来源的应用程序`

![damage-app](https://luzc.js.org/_media/damage-app.png)

## 解决方法

执行以下命令即可，注意的是，示例中安装的是 `Navicat Premium.app`，如果是其他应用，更改名称即可。

```shell
sudo xattr -r -d com.apple.quarantine /Applications/Navicat\ Premium.app
```

这行命令的各部分含义如下：

- `sudo`: 以超级用户权限执行命令。
- `xattr`: 用于查看或修改文件的扩展属性。
- `-r`: 递归地处理目录，即对目录中的所有文件都执行相同的操作。
- `-d com.apple.quarantine`: 删除指定属性，即删除 com.apple.quarantine 属性。
- `/Applications/Navicat\ Premium.app`: 指定要处理的目标应用程序的路径。在这种情况下，是 Navicat Premium 应用程序的路径。

执行这个命令后，应用程序的隔离属性将被移除，使得系统不再将其标记为来自不受信任来源的应用程序
